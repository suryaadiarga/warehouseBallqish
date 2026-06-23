class Warehouse {
  const Warehouse({
    required this.id,
    required this.name,
    this.location,
  });

  final int id;
  final String name;
  final String? location;

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
    id: json['id'] as int,
    name: json['name']?.toString() ?? '',
    location: json['location']?.toString(),
  );
}
