import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../theme/app_theme.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.imageUrl,
    this.size = 58,
    this.borderRadius = 14,
    this.showIllustrationLabel = false,
  });

  final String? imageUrl;
  final double size;
  final double borderRadius;
  final bool showIllustrationLabel;

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
            if (showIllustrationLabel)
              const Positioned(
                left: 3,
                bottom: 3,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Color(0xB8020617),
                    borderRadius: BorderRadius.all(Radius.circular(4)),
                  ),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Text(
                      'ILUSTRASI',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 6,
                        fontWeight: FontWeight.w800,
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
