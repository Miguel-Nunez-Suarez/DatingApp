import { AuthService } from 'src/app/_services/auth.service';
import { AlertifyjsService } from '../_services/alertifyjs.service';
import { UserService } from '../_services/user.service';
import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Message } from '../_models/message';

@Injectable()
export class MessageResolver implements Resolve<Message[]> {
  pageNumber = 1;
  pageSize = 5;
  messageContainer = 'Unread';

  constructor(
    private userService: UserService,
    private router: Router,
    private alerify: AlertifyjsService,
    private authService: AuthService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Message[]> {
    return this.userService.getMessages(this.authService.decodedToken.nameid, this.pageNumber,
        this.pageSize, this.messageContainer).pipe(
        catchError(error => {
            this.alerify.error('Problem retrieving messages');
            this.router.navigate(['/home']);
            return of(null);
        })
    );
  }
}
