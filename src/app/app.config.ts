import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor }    from './core/auth/auth.interceptor';
import { errorInterceptor }   from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { empresaInterceptor } from './core/interceptors/empresa.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),           // sin withViewTransitions — causa InvalidStateError en Angular 20
    provideHttpClient(
      withInterceptors([authInterceptor, empresaInterceptor, errorInterceptor, loadingInterceptor])
    ),
    provideAnimations(),
  ]
};
