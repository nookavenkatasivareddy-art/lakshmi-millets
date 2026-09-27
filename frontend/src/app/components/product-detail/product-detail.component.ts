import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity = 1;
  loading = true;

  // Reviews
  reviews: any[] = [];
  reviewTotal = 0;
  reviewAverage = 0;
  reviewLoading = false;

  showReviewForm = false;
  reviewName = '';
  reviewRating = 5;
  reviewComment = '';
  reviewSubmitting = false;
  reviewMessage = '';
  relatedProducts: Product[] = [];
  wishlistMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cart: CartService,
    private whatsapp: WhatsappService,
    private wishlist: WishlistService,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;

    this.productService.getProduct(slug).subscribe({
      next: p => {
        this.product = p;
        this.loading = false;
        this.loadRelatedProducts(p);

        // Load reviews after product is loaded
        this.loadReviews(slug);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadReviews(slug: string): void {
    this.reviewLoading = true;

    this.productService.getReviews(slug).subscribe({
      next: res => {
        this.reviews = res.reviews || [];
        this.reviewTotal = res.total || 0;
        this.reviewAverage = res.average || 0;
        this.reviewLoading = false;
      },
      error: () => {
        this.reviews = [];
        this.reviewTotal = 0;
        this.reviewAverage = 0;
        this.reviewLoading = false;
      }
    });
  }

  changeQty(delta: number): void {
    const max = this.product ? this.product.stock : 999;
    this.quantity = Math.min(
      Math.max(1, this.quantity + delta),
      Math.max(1, max)
    );
  }

  addToCart(): void {
    if (this.product && this.product.stock > 0) {
      this.cart.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  buyNow(): void {
    if (this.product && this.product.stock > 0) {
      this.cart.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  openReviewForm(): void {
    this.showReviewForm = true;
    this.reviewMessage = '';
  }

  closeReviewForm(): void {
    this.showReviewForm = false;
    this.reviewMessage = '';
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(): void {
    if (!this.product) return;

    const name = this.reviewName.trim();
    const comment = this.reviewComment.trim();

    if (!name) {
      this.reviewMessage = 'Please enter your name.';
      return;
    }

    if (!comment) {
      this.reviewMessage = 'Please write a short review.';
      return;
    }

    this.reviewSubmitting = true;
    this.reviewMessage = '';

    const slug = this.route.snapshot.paramMap.get('slug')!;

    this.productService.submitReview(slug, {
      userName: name,
      rating: this.reviewRating,
      comment
    }).subscribe({
      next: res => {
        this.reviewSubmitting = false;
        this.reviewMessage =
          res?.message || 'Review submitted. Thank you!';

        this.reviewName = '';
        this.reviewRating = 5;
        this.reviewComment = '';

        this.loadReviews(slug);

        setTimeout(() => {
          this.showReviewForm = false;
          this.reviewMessage = '';
        }, 1800);
      },
      error: err => {
        this.reviewSubmitting = false;
        this.reviewMessage =
          err?.error?.message ||
          'Unable to submit review. Please try again.';
      }
    });
  }

  getStars(rating: number): string {
    const rounded = Math.round(rating || 0);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  }
  toggleWishlist(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if (!this.product) return;

  const alreadyInWishlist = this.wishlist.isInWishlist(this.product.id);

  this.wishlist.toggle(this.product);

  this.wishlistMessage = alreadyInWishlist
    ? 'Product removed from my wishlist'
    : 'Product is added to my wishlist';

  setTimeout(() => {
    this.wishlistMessage = '';
  }, 1800);
}

isInWishlist(): boolean {
  return this.product
    ? this.wishlist.isInWishlist(this.product.id)
    : false;
}
isRelatedInWishlist(product: Product): boolean {
  return this.wishlist.isInWishlist(product.id);
}

toggleRelatedWishlist(product: Product, event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  const alreadyInWishlist = this.wishlist.isInWishlist(product.id);

  this.wishlist.toggle(product);

  this.wishlistMessage = alreadyInWishlist
    ? 'Product removed from my wishlist'
    : 'Product is added to my wishlist';

  setTimeout(() => {
    this.wishlistMessage = '';
  }, 1800);
}

addRelatedToCart(product: Product): void {
  if (product.stock <= 0) return;

  this.cart.addToCart(product, 1);
  this.router.navigate(['/checkout']);
}
loadRelatedProducts(currentProduct: Product): void {
  let categorySlug = '';

  if (typeof currentProduct.category === 'string') {
    categorySlug = currentProduct.category;
  } else if (currentProduct.category) {
    categorySlug = currentProduct.category.slug;
  }

  if (!categorySlug) {
    this.relatedProducts = [];
    return;
  }

  this.productService.getProducts({
    category: categorySlug
  }).subscribe({
    next: products => {
      this.relatedProducts = products
        .filter(item => item.id !== currentProduct.id)
        .slice(0, 4);
    },
    error: () => {
      this.relatedProducts = [];
    }
  });
}
}
