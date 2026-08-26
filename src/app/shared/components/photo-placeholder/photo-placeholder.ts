import { Component, input } from '@angular/core';

@Component({
  selector: 'app-photo-placeholder',
  standalone: true,
  templateUrl: './photo-placeholder.html',
  styleUrl: './photo-placeholder.scss',
  host: { '[class]': 'className()' },
})
export class PhotoPlaceholder {
  readonly label = input('Foto');
  readonly className = input('');
}
