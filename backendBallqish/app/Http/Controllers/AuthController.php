<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\User;
use App\Support\UserRoles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * REGISTRASI USER BARU (Opsional, biasanya untuk user gudang baru)
     */
    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? UserRoles::WAREHOUSE_STAFF,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Registrasi berhasil', 201);
    }

    /**
     * LOGIN USER
     */
    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        // Hapus token lama agar tidak menumpuk di database (Opsional, bagus untuk keamanan 1 device)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 'Login berhasil');
    }

    /**
     * LOGOUT USER (Hapus Token Aktif)
     */
    public function logout(Request $request)
    {
        // Menghapus token yang sedang digunakan untuk request ini
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Berhasil logout dan token telah dihapus');
    }

    /**
     * GET PROFILE (Untuk mengecek token masih valid / ambil data user saat refresh page)
     */
    public function me(Request $request)
    {
        return $this->successResponse($request->user(), 'Profil pengguna berhasil diambil');
    }

    /**
     * UBAH PASSWORD / RESET
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        // cek apakah password lama benar
        if (! Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('Password saat ini salah!', 400);
        }

        // update password baru
        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        // Opsional: Hapus semua token agar user harus login ulang dengan password baru
        $user->tokens()->delete();

        return $this->successResponse(null, 'Password berhasil diubah. Silakan login kembali.');
    }

    public function notifications(Request $request)
    {
        $notifications = $request->user()->notifications()
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                ...$notification->data,
                'read_at' => optional($notification->read_at)?->toDateTimeString(),
                'created_at' => optional($notification->created_at)?->toDateTimeString(),
            ]);

        return $this->successResponse($notifications, 'Notifikasi berhasil diambil', 200, [
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function readNotification(Request $request, string $notificationId)
    {
        $notification = $request->user()->notifications()->findOrFail($notificationId);
        $notification->markAsRead();

        return $this->successResponse(null, 'Notifikasi ditandai sudah dibaca');
    }

    public function readAllNotifications(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->successResponse(null, 'Semua notifikasi ditandai sudah dibaca');
    }
}
