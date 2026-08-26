import { Component } from '@angular/core';
import { Produtos } from '../components/produtos/produtos';
import { Footer } from '../layout/footer/footer';
import { Navbar } from '../layout/navbar/navbar';
import { Beneficios } from './beneficios/beneficios';
import { Galeria } from './galeria/galeria';
import { Hero } from './hero/hero';
import { Sobre } from './sobre/sobre';

@Component({
  selector: 'app-home', standalone: true,
  imports: [Navbar, Hero, Produtos, Sobre, Beneficios, Galeria, Footer],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class Home {}
