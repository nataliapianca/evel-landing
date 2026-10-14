import { Component } from '@angular/core';
import { PhotoPlaceholder } from '../../shared/components/photo-placeholder/photo-placeholder';

@Component({
  selector: 'app-galeria', standalone: true, imports: [PhotoPlaceholder],
  templateUrl: './galeria.html', styleUrl: './galeria.scss',
})
export class Galeria {}

