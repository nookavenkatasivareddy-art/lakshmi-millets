import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqs = [
    ['What are millets, and why should I eat them?', 'Millets are ancient, gluten-free grains that are naturally rich in fiber, protein, and minerals like iron and calcium. They have a low glycemic index, making them a great choice for diabetics, weight management, and overall gut health.'],
    ['What products do you sell?', 'We offer a range of millet-based foods including flours, grains, snacks, and biscuits — all sourced and processed to preserve their natural nutrition.'],
    ['Are your products 100% natural?', 'Yes. Our millets are minimally processed with no artificial preservatives, colors, or additives.'],
    ['How do I place an order?', "Browse our products, add items to your cart, and proceed to checkout. You'll need to log in or create an account, add a delivery address, choose a payment method, and confirm your order."],
    ['Which cities do you deliver to?', 'We currently deliver to Hyderabad, Bangalore, Chennai, and Vijayawada (Andhra Pradesh). Delivery charges and estimated delivery times vary by city and are shown at checkout.'],
    ['Is delivery free?', 'Yes — orders above ₹499 (in items) qualify for free delivery. Below that, a small delivery charge applies based on your city.'],
    ['What payment methods do you accept?', 'We accept Cash on Delivery (COD), UPI, Credit/Debit Cards, and Net Banking.'],
    ['How do I know if a product is in stock?', 'Product availability is shown live on each product page. Items that are sold out are clearly marked "Out of Stock" and can\'t be added to your cart. If only a few units remain, you\'ll see a "low stock" notice so you can order before it runs out.'],
    ['Can I track my order?', 'Yes. Once logged in, you can view your order history and status anytime from the "My Orders" section.'],
    ['What is your return/refund policy?', 'Since we deal in packaged food items, we currently do not accept returns once an order is delivered, unless the product arrives damaged or incorrect — in which case, contact us within 48 hours for a replacement or refund.'],
    ['How do I contact you for support?', 'You can reach us through the Contact page on our website, or via the email/phone number listed there. We aim to respond within 24 hours.'],
    ['Do you offer bulk or wholesale orders?', "Yes, for bulk requirements please contact us directly through the Contact page, and we'll get back to you with pricing and availability."]
  ];
}