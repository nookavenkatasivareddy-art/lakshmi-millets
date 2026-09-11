import { Component } from '@angular/core';

interface BenefitItem {
  title: string;
  desc: string;
}

@Component({
  selector: 'app-benefits',
  templateUrl: './benefits.component.html',
  styleUrls: ['./benefits.component.css']
})
export class BenefitsComponent {
  coreBenefits: BenefitItem[] = [
    { title: 'High in dietary fibre', desc: 'Supports healthy digestion and helps you feel full for longer.' },
    { title: 'Rich in nutrients', desc: 'Provides minerals such as iron, magnesium, phosphorus and zinc.' },
    { title: 'Supports heart health', desc: 'Can be part of a heart-friendly balanced diet.' },
    { title: 'Helps manage blood sugar', desc: 'The fibre content may help with better blood sugar control.' },
    { title: 'Supports weight management', desc: 'Helps promote fullness and reduce unnecessary snacking.' },
    { title: 'Good for bone health', desc: 'Provides important minerals such as magnesium and phosphorus.' },
    { title: 'Naturally gluten-free', desc: 'Suitable for people who need to avoid gluten.' },
    { title: 'Versatile food', desc: 'Can be used to prepare dosa, idli, upma, pongal, porridge, malt and more.' }
  ];

  moreBenefits: BenefitItem[] = [
    { title: 'Rich in antioxidants', desc: 'Helps protect cells from oxidative stress.' },
    { title: 'Supports gut health', desc: 'Fibre can support healthy bowel movements and beneficial gut bacteria.' },
    { title: 'Provides steady energy', desc: 'A good source of complex carbohydrates for everyday energy.' },
    { title: 'Contains plant-based protein', desc: 'Contributes to daily protein intake.' },
    { title: 'Supports immunity', desc: 'Provides nutrients such as zinc, iron and other micronutrients that support normal immune function.' },
    { title: 'Supports healthy metabolism', desc: 'Provides magnesium and other nutrients involved in normal metabolic processes.' },
    { title: 'May support cholesterol management', desc: 'Replacing refined grains with higher-fibre whole grains can support a healthy cholesterol profile.' },
    { title: 'Helps maintain fullness', desc: 'Fibre and complex carbohydrates can help keep you satisfied after meals.' },
    { title: 'Good alternative to refined grains', desc: 'Can be used instead of highly refined rice or flour in many dishes.' },
    { title: 'Naturally nutritious whole grain', desc: 'Provides a combination of fibre, carbohydrates, protein and minerals.' },
    { title: 'Suitable for different recipes', desc: 'Useful for breakfast, snacks, main meals and beverages such as millet malt.' },
    { title: 'Supports a balanced diet', desc: 'Easy to include as part of a varied and nutritious eating pattern.' }
  ];
}
