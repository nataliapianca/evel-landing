import { Component } from '@angular/core';
import { PhotoPlaceholder } from '../../shared/components/photo-placeholder/photo-placeholder';

@Component({
  selector: 'app-sobre', standalone: true, imports: [PhotoPlaceholder],
  templateUrl: './sobre.html', styleUrl: './sobre.scss',
})
export class Sobre {}
