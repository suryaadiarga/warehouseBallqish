class Warehouse {
  const Warehouse({
    required this.id,
    required this.name,
    this.location,
    this.latitude,
    this.longitude,
  });

  final int id;
  final String name;
  final String? location;
  final String? latitude;
  final String? longitude;

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
    id: json['id'] as int,
    name: json['name']?.toString() ?? '',
    location: json['location']?.toString(),
    latitude: json['latitude']?.toString(),
    longitude: json['longitude']?.toString(),
  );
}
