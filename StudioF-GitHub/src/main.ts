import { bootstrapApplication } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Section = 'inicio' | 'acerca' | 'beneficios' | 'politicas' | 'establecimientos' | 'cuenta' | 'contacto';

@Component({ selector: 'app-root', standalone: true, imports: [FormsModule], template: `
<header class="top"><span>.:: STUDIO F ::. | 0.0.5</span><button class="login-link" (click)="navigate('cuenta')">Iniciar sesión</button></header>
<div class="brand"><img src="./img/logo/logo_studiof.jpg" alt="STUDIO F"></div>
<nav aria-label="Navegación principal"><button class="mobile-menu" (click)="toggleMenu()">☰ Menú</button><div class="nav-links" [class.open]="menuOpen()">
@for (item of navigation; track item.id) { <button [class.active]="section() === item.id" (click)="navigate(item.id)">{{item.label}}</button> }
</div></nav>
<main>
@if (section() === 'inicio') {
  <section class="hero"><img [src]="slides[slide()]" alt="Colección STUDIO F"><button class="arrow prev" aria-label="Anterior" (click)="move(-1)">‹</button><button class="arrow next" aria-label="Siguiente" (click)="move(1)">›</button><div class="dots">@for (image of slides; track image; let i = $index) { <button [class.selected]="i === slide()" [attr.aria-label]="'Diapositiva ' + (i + 1)" (click)="slide.set(i)"></button> }</div></section>
} @else if (section() === 'cuenta') {
  <section class="panel account-panel"><p class="eyebrow">STUDIO F</p><h1>MI CUENTA</h1><p class="muted">Ingresa con los datos de tu cuenta de lealtad.</p><form class="account-form" (ngSubmit)="submitLogin()"><label for="username">Nombre de Usuario</label><input id="username" name="username" [(ngModel)]="username" maxlength="48" autocomplete="username" required autofocus><label for="password">Contraseña</label><input id="password" name="password" [(ngModel)]="password" type="password" maxlength="17" autocomplete="current-password" required><label class="remember"><input type="checkbox" name="remember" [(ngModel)]="remember">Recordar contraseña</label><button class="primary" type="submit">Enviar</button></form><p class="notice" aria-live="polite">{{accountNotice()}}</p><p class="backend">La cuenta se valida en el servidor original. El formulario local está listo, pero el servicio de autenticación no está disponible en esta migración.</p></section>
} @else {
  <section class="panel content original-content" aria-live="polite">
    @if (loading()) { <p class="muted">Cargando contenido…</p> }
    @else if (loadError()) { <h2>No se pudo cargar esta sección</h2><p>{{loadError()}}</p> }
    @else { <div [innerHTML]="sectionContent()"></div> }
    @if (section() === 'contacto' && !loading() && !loadError()) {
      <form class="contact-form" (ngSubmit)="submitContact()">
        <h2>Envíanos tu consulta</h2><div class="form-grid">
          <label>Nombres<input name="contactName" [(ngModel)]="contactName" required autocomplete="given-name"></label>
          <label>Apellidos<input name="contactLastName" [(ngModel)]="contactLastName" required autocomplete="family-name"></label>
          <label>Teléfono<input name="contactPhone" [(ngModel)]="contactPhone" type="tel" autocomplete="tel"></label>
          <label>E-Mail<input name="contactEmail" [(ngModel)]="contactEmail" type="email" required autocomplete="email"></label>
          <label>No. Tarjeta Cliente<input name="contactCard" [(ngModel)]="contactCard"></label>
          <label class="message-field">Mensaje<textarea name="contactMessage" [(ngModel)]="contactMessage" rows="4" required></textarea></label>
        </div><button class="primary" type="submit">Enviar</button><p class="notice" aria-live="polite">{{contactNotice()}}</p>
      </form>
    }
    @if (section() === 'contacto') { <p class="backend">El formulario valida los campos en esta página, pero para enviar la consulta se necesita conectar el servicio original.</p> }
  </section>
}
</main>
<footer><div><img src="./img/logo/logo_studiof_footer.jpg" alt="STUDIO F"><span>Todos los derechos reservados</span></div><img class="datacode" src="./img/DATACODE.png" alt="Datacode"></footer>
` })
export class AppComponent {
  readonly navigation: { id: Section; label: string }[] = [
    { id: 'inicio', label: 'INICIO' }, { id: 'acerca', label: 'ACERCA DE' }, { id: 'beneficios', label: 'BENEFICIOS' }, { id: 'politicas', label: 'POLÍTICAS' }, { id: 'establecimientos', label: 'ESTABLECIMIENTOS' }, { id: 'cuenta', label: 'MI CUENTA' }, { id: 'contacto', label: 'CONTÁCTANOS' }
  ];
  private readonly contentFiles: Partial<Record<Section, string>> = {
    acerca: 'acerca', beneficios: 'politicas', politicas: 'condiciones', establecimientos: 'establecimientos', contacto: 'contacto'
  };
  readonly slides = ['./img/slider/SLIDE4.png', './img/slider/SLIDE2.png', './img/slider/SLIDE3.png', './img/slider/SLIDE1.png'];
  readonly section = signal<Section>('inicio');
  readonly slide = signal(0);
  readonly menuOpen = signal(false);
  readonly loading = signal(false);
  readonly sectionContent = signal('');
  readonly loadError = signal('');
  readonly accountNotice = signal('');
  readonly contactNotice = signal('');
  username = '';
  password = '';
  remember = false;
  contactName = '';
  contactLastName = '';
  contactPhone = '';
  contactEmail = '';
  contactCard = '';
  contactMessage = '';
  private contentRequest = 0;

  toggleMenu(): void { this.menuOpen.update(open => !open); }

  async navigate(section: Section): Promise<void> {
    const requestId = ++this.contentRequest;
    this.section.set(section);
    this.menuOpen.set(false);
    this.sectionContent.set('');
    this.loadError.set('');
    this.accountNotice.set('');
    this.contactNotice.set('');
    const page = this.contentFiles[section];
    this.loading.set(Boolean(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!page) return;
    const url = new URL(`./contenido/${page}.html`, document.baseURI);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} al leer ${url.pathname}`);
      let html = await response.text();
      if (requestId !== this.contentRequest) return;
      if (section === 'contacto') html = html.replace(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi, '');
      this.sectionContent.set(html);
    } catch (error) {
      if (requestId !== this.contentRequest) return;
      this.loadError.set(error instanceof Error ? error.message : 'Error leyendo el archivo local.');
    } finally {
      if (requestId === this.contentRequest) this.loading.set(false);
    }
  }

  move(direction: number): void { this.slide.update(index => (index + direction + this.slides.length) % this.slides.length); }
  submitLogin(): void { this.accountNotice.set('Los campos están completos. Para validar la cuenta se requiere el servicio de autenticación original.'); }
  submitContact(): void { this.contactNotice.set('Los campos son válidos. La consulta no se envió porque el servicio original no está conectado.'); }
}

bootstrapApplication(AppComponent).catch(error => console.error(error));
