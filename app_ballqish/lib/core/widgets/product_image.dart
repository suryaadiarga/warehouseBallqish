import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../theme/app_theme.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.imageUrl,
    this.size = 58,
    this.borderRadius = 14,
  });

  final String? imageUrl;
  final double size;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppColors.slate100,
          border: Border.all(color: AppColors.slate200),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              ApiConfig.resolveAssetUrl(imageUrl),
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const ColoredBox(
                color: AppColors.slate100,
                child: Icon(
                  Icons.inventory_2_outlined,
                  color: AppColors.slate400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
