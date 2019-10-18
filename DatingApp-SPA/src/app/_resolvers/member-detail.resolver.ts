import { AlertifyjsService } from './../_services/alertifyjs.service';
import { UserService } from './../_services/user.service';
import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from '../_models/user';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class MemberDetailResolver implements Resolve<User> {
  constructor(
    private userService: UserService,
    private router: Router,
    private alerify: AlertifyjsService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<User> {
    return this.userService.getUser(route.params['id']).pipe(
        catchError(error => {
            this.alerify.error('Problem retrieving data');
            this.router.navigate(['/members']);
            return of(null);
        })
    );
  }
}
