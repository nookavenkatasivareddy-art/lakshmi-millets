import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { DeliveryLocation, Address } from '../../core/models/models';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  addressForm: FormGroup;
  savedAddresses: Address[] = [];
  selectedAddressId = '';
  showNewAddressForm = false;
  defaultLocationId = '';
  paymentMethod: 'COD' | 'UPI' | 'CARD' | 'NETBANKING' = 'COD';
  placing = false;
  errorMsg = '';

  selectedUpiApp = '';
  showPaymentLinkModal = false;
  showPaymentVerificationModal = false;
  placedOrderId = '';
  verificationUtr = '';
  verificationScreenshot = '';

  upiApps = [
    { id: 'phonepay', name: 'PhonePe', short: 'P', color: '#602697' },
    { id: 'paytm', name: 'Paytm', short: 'P', color: '#00baf2' },
    { id: 'gpay', name: 'Google Pay', short: 'G', color: '#42853B' },
    { id: 'amazonpay', name: 'Amazon Pay', short: 'a', color: '#232f3e' },
    { id: 'bhim', name: 'BHIM App', short: 'B', color: '#ee6723' },
    { id: 'cred', name: 'CRED UPI', short: 'C', color: '#0b0b0b' },
    { id: 'kiwi', name: 'Kiwi UPI', short: 'K', color: '#6fce44' },
    { id: 'airtel', name: 'Airtel Payments Bank UPI', short: 'A', color: '#e40000' },
    { id: 'fampay', name: 'FamPay', short: 'F', color: '#ff8a00' }
  ];

  constructor(
    private fb: FormBuilder,
    private cart: CartService,
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private auth: AuthService,
    private whatsapp: WhatsappService,
    private router: Router
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    if (this.cart.items.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.auth.getMe().subscribe({
      next: (res) => {
        const user = res.user;
        this.savedAddresses = user?.addresses || [];
        if (this.savedAddresses.length > 0) {
          const def = this.savedAddresses.find((a) => a.isDefault) || this.savedAddresses[0];
          this.selectedAddressId = this.addressId(def);
        } else {
          this.showNewAddressForm = true;
        }
      },
      error: () => {
        this.savedAddresses = [];
        this.showNewAddressForm = true;
      }
    });

    this.deliveryService.getLocations().subscribe({
      next: locs => {
        if (locs.length) this.defaultLocationId = locs[0].id || locs[0]._id || '';
      }
    });
  }

  get itemsTotal(): number {
    return this.cart.itemsTotal;
  }

  get deliveryCharge(): number {
    if (!this.defaultLocationId) return 0;
    const locs = this.deliveryService.locations;
    if (!locs) return 0;
    const found = locs.find((l: DeliveryLocation) => (l.id || l._id) === this.defaultLocationId);
    if (!found) return 0;
    return this.itemsTotal >= found.freeDeliveryAbove ? 0 : found.deliveryCharge;
  }

  get grandTotal(): number {
    return this.itemsTotal + this.deliveryCharge;
  }

  selectAddress(id: string) {
    this.selectedAddressId = id;
    this.showNewAddressForm = false;
    this.addressForm.reset();
  }

  toggleNewAddressForm() {
    this.showNewAddressForm = !this.showNewAddressForm;
    if (!this.showNewAddressForm) {
      this.addressForm.reset();
      this.selectedAddressId = this.addressId(this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0]);
    }
  }

  private addressId(addr: Address | undefined): string {
    if (!addr) return '';
    return addr.id || addr._id || '';
  }

  private hasTypedAddressInput(): boolean {
    if (this.showNewAddressForm) return true;
    const v = this.addressForm.value || {};
    return ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode']
      .some(k => String(v[k] || '').trim().length > 0);
  }

  private describeAddressProblem(v: any): string | null {
    if (!String(v.fullName || '').trim()) return 'full name required';
    if (!/^[0-9]{10}$/.test(String(v.phone || '').trim())) return 'phone must be 10 digits';
    if (!String(v.line1 || '').trim()) return 'address line 1 required';
    if (!String(v.city || '').trim()) return 'city required';
    if (!String(v.state || '').trim()) return 'state required';
    if (!/^[0-9]{6}$/.test(String(v.pincode || '').trim())) return 'pincode must be 6 digits';
    return null;
  }

  selectUpiApp(id: string) {
    this.selectedUpiApp = id;
  }

  openPaymentLinkModal() {
    this.showPaymentLinkModal = true;
  }

  closePaymentLinkModal() {
    this.showPaymentLinkModal = false;
  }

  sharePaymentLink() {
    const upiId = '8897626612@sbi';
    const payeeName = 'Lakshmi Millets';
    const transactionNote = `Lakshmi Millets order payment`;
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${this.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    const message = `Lakshmi Millets payment link for ₹${this.grandTotal}: ${upiLink}`;
    const whatsappUrl = `https://wa.me/918897626612?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank', 'noopener');
    this.closePaymentLinkModal();
  }

  placeOrder() {
    let shippingAddress: any;

    const typedAddress = this.hasTypedAddressInput() ? { ...this.addressForm.value } : null;
    const typedAddressError = typedAddress ? this.describeAddressProblem(typedAddress) : null;

    if (typedAddress && !typedAddressError) {
      shippingAddress = typedAddress;
      this.showNewAddressForm = false;
    } else if (this.selectedAddressId) {
      const addr = this.savedAddresses.find(a => this.addressId(a) === this.selectedAddressId);
      if (!addr) {
        this.errorMsg = 'Please select a delivery address';
        return;
      }
      const { fullName, phone, line1, line2, city, state, pincode } = addr;
      shippingAddress = { fullName, phone, line1, line2, city, state, pincode };
      if (typedAddressError) {
        this.addressForm.markAllAsTouched();
        this.errorMsg = `New address incomplete (${typedAddressError}). Fix it or clear the form to use the saved address.`;
        return;
      }
    } else if (typedAddress) {
      this.addressForm.markAllAsTouched();
      this.errorMsg = `Please fix the delivery address (${typedAddressError || 'all fields required'}).`;
      return;
    } else {
      this.addressForm.markAllAsTouched();
      this.showNewAddressForm = true;
      this.errorMsg = 'Please add a delivery address';
      return;
    }

    this.placing = true;
    this.errorMsg = '';

    const items = this.cart.items.map(i => ({ ...i }));

    const finish = (paymentId?: string) => {
      const payload: any = {
        items,
        shippingAddress,
        paymentMethod: this.paymentMethod,
        paymentId
      };
      if (this.defaultLocationId) {
        payload.deliveryLocationId = this.defaultLocationId;
      }
      this.orderService.placeOrder(payload).subscribe({
        next: (order) => {
          this.cart.clearCart();
          this.placing = false;
          this.placedOrderId = order?.id || order?._id || '';

          // Send order details to admin WhatsApp
          try {
            this.whatsapp.sendCheckoutOrder({
              orderId: this.placedOrderId,
              items,
              itemsTotal: this.itemsTotal,
              deliveryCharge: this.deliveryCharge,
              grandTotal: this.grandTotal,
              shippingAddress,
              paymentMethod: this.paymentMethod,
              upiLink: order?.paymentDetails?.upiLink,
              upiId: order?.paymentDetails?.upiId
            });
          } catch (e) {
            console.warn('[checkout] whatsapp open failed', e);
          }

          if (this.paymentMethod === 'UPI') {
            this.showPaymentVerificationModal = true;
          } else {
            this.router.navigate(['/orders'], { state: { placedOrderId: this.placedOrderId } });
          }
        },
        error: (err) => {
          this.placing = false;
          this.errorMsg = err.error?.message || `Failed to place order (${err.status || 'network'}).`;
        }
      });
    };

    if (this.paymentMethod === 'COD' || this.paymentMethod === 'UPI') {
      finish();
    } else {
      this.paymentService.createPayment(this.grandTotal, this.paymentMethod).subscribe({
        next: (payRes) => {
          this.paymentService.verifyPayment(payRes.gatewayOrderId).subscribe({
            next: (verifyRes) => finish(verifyRes.paymentId),
            error: () => { this.placing = false; this.errorMsg = 'Payment verification failed'; }
          });
        },
        error: () => { this.placing = false; this.errorMsg = 'Could not initiate payment'; }
      });
    }
  }

  /** Customer submits payment proof (screenshot + UTR) for UPI orders */
  submitPaymentVerification(utr: string, screenshot: string) {
    if (!utr || !screenshot) {
      this.errorMsg = 'Please provide both UTR and screenshot';
      return;
    }

    this.orderService.submitPaymentVerification(this.placedOrderId, utr, screenshot).subscribe({
      next: () => {
        this.showPaymentVerificationModal = false;
        this.whatsapp.sendPaymentVerification(
          this.placedOrderId,
          utr,
          screenshot,
          this.grandTotal,
          this.addressForm.value
        );
        this.router.navigate(['/orders'], { state: { placedOrderId: this.placedOrderId } });
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to submit payment verification';
      }
    });
  }
}
