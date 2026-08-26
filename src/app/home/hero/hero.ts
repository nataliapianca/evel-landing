import { Component } from '@angular/core';
import { PhotoPlaceholder } from '../../shared/components/photo-placeholder/photo-placeholder';

@Component({
  selector: 'app-hero', standalone: true, imports: [PhotoPlaceholder],
  templateUrl: './hero.html', styleUrl: './hero.scss',
})
export class Hero {}
