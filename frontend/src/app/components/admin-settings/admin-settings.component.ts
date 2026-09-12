import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../../core/services/delivery.service';
import { DeliveryLocation } from '../../core/models/models';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {
  isAuthenticated = false;
  passwordInput = '';
  errorMsg = '';
  locations: DeliveryLocation[] = [];
  loading = false;
  saving = false;

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations() {
    this.loading = true;
    this.deliveryService.getAllLocations().subscribe({
      next: locs => { this.locations = locs || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  authenticate() {
    const ADMIN_PASSWORD = 'admin123';
    if (this.passwordInput === ADMIN_PASSWORD) {
      this.isAuthenticated = true;
      this.errorMsg = '';
    } else {
      this.isAuthenticated = false;
      this.errorMsg = 'Incorrect password';
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.passwordInput = '';
  }

  updateDeliveryCharge(location: any) {
    this.saving = true;
    this.deliveryService.updateLocation(location.id || location._id, {
      deliveryCharge: location.deliveryCharge,
      freeDeliveryAbove: location.freeDeliveryAbove,
      estimatedDays: location.estimatedDays
    }).subscribe({
      next: () => { this.saving = false; },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.message || 'Failed to update'; }
    });
  }
}
