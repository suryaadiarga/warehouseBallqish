import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../main_navigation/screens/main_navigation_screen.dart';
import '../data/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _authService = AuthService();
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _authService.login(_email.text.trim(), _password.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
      );
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: AppColors.slate50,
      ),
      child: Scaffold(
        body: Stack(
          children: [
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [AppColors.slate50, AppColors.indigo50],
                  ),
                ),
              ),
            ),
            Positioned(
              top: -90,
              left: -80,
              child: Container(
                width: 260,
                height: 260,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x240EA5E9),
                ),
              ),
            ),
            Positioned(
              right: -120,
              bottom: -100,
              child: Container(
                width: 320,
                height: 320,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x140F172A),
                ),
              ),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(24, 26, 24, 28),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .94),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: AppColors.slate200),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x140F172A),
                            blurRadius: 45,
                            offset: Offset(0, 20),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: AppColors.sky50,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: AppColors.sky100,
                                      ),
                                    ),
                                    child: const Icon(
                                      Icons.warehouse_outlined,
                                      color: AppColors.sky600,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'BALLQISH',
                                        style: TextStyle(
                                          color: AppColors.slate900,
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          height: 1,
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Text(
                                        'GUDANG',
                                        style: TextStyle(
                                          color: AppColors.sky500,
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          height: 1,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 32),
                            const Text(
                              'AKSES AMAN',
                              style: TextStyle(
                                color: AppColors.sky600,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.4,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Masuk ke ruang kerja gudang',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Gunakan akun Anda untuk masuk ke Ballqish WMS.',
                              style: TextStyle(
                                color: AppColors.slate500,
                                fontSize: 15,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 28),
                            const _FieldLabel('Alamat Email'),
                            const SizedBox(height: 8),
                            AppTextField(
                              controller: _email,
                              label: 'Masukkan email Anda',
                              hintText: 'Masukkan email Anda',
                              labelAsHint: true,
                              icon: Icons.mail_outline,
                              keyboardType: TextInputType.emailAddress,
                              validator: Validators.email,
                            ),
                            const SizedBox(height: 18),
                            const _FieldLabel('Kata Sandi'),
                            const SizedBox(height: 8),
                            AppTextField(
                              controller: _password,
                              label: 'Masukkan kata sandi Anda',
                              hintText: 'Masukkan kata sandi Anda',
                              labelAsHint: true,
                              icon: Icons.lock_outline,
                              obscureText: true,
                              validator: (value) =>
                                  Validators.required(value, 'Kata sandi'),
                            ),
                            const SizedBox(height: 26),
                            AppButton(
                              label: _loading ? 'Memverifikasi...' : 'Masuk',
                              icon: Icons.arrow_forward,
                              loading: _loading,
                              onPressed: _login,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: AppColors.slate700,
        fontSize: 13,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
