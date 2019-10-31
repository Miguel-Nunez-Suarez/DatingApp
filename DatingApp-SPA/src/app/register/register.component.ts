import { Router } from '@angular/router';
import { AlertifyjsService } from './../_services/alertifyjs.service';
import { AuthService } from './../_services/auth.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap';
import { User } from '../_models/user';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @Output() cancelRegister = new EventEmitter();
  user: User;
  registerForm: FormGroup;
  // Partial makes all of the properties in the type optional
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    private authService: AuthService,
    private alertify: AlertifyjsService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.bsConfig = {
      containerClass: 'theme-red'
    };
    this.createRegisterForm();
  }

  createRegisterForm() {
    this.registerForm = this.fb.group({
      gender: ['male'],
      username: ['', Validators.required],
      knownAs: ['', Validators.required],
      dateOfBirth: [null, Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {validator: this.passwordMatch});
  }

  passwordMatch(g: FormGroup) {
    return g.get('password').value === g.get('confirmPassword').value ? null : {mismatch: true};
  }
  register() {
    // form is checked to see if is valid
    // user is registered
    // user is logged in 
    // app is redirected to the memeber page
    if (this.registerForm.valid){
      this.user = Object.assign({},this.registerForm.value)
      this.authService.register(this.user).subscribe(() => {
        this.alertify.success('Registration successful')
      }, error => {
        this.alertify.error(error)
      }, () => {
        this.authService.login(this.user).subscribe(()=>{
          this.router.navigate(['/members']);
        });
      });
    }
  }
  cancel() {
    this.cancelRegister.emit(false);
  }
}
