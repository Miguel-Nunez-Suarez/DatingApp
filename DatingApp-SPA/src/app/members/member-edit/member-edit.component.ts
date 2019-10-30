import { AuthService } from './../../_services/auth.service';
import { UserService } from './../../_services/user.service';
import { AlertifyjsService } from './../../_services/alertifyjs.service';
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { User } from 'src/app/_models/user';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm', {static: true}) editForm: NgForm;
  // we add a property for our user:
  user: User;
  photoUrl: string;
  // host listener:
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event){
    if(this.editForm.dirty)
    {
      $event.returnValue= true;
    }
  }
  // we add activatedRoute to have access to the route and the data on it
  constructor(private route: ActivatedRoute, private alertify: AlertifyjsService,
              private userService: UserService, private authService: AuthService) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user = data['user'];
    });
    this.authService.currentPhotoUrl.subscribe(photoUrl => this.photoUrl = photoUrl);
  }

  updateUser() {
    this.userService.updateUser(this.authService.decodedToken.nameid, this.user).subscribe( next =>{
      this.alertify.message('User Updated Successfully');
      this.editForm.reset(this.user);
    }, error =>{
      this.alertify.error(error);
    });

  }
  
  updateMainPhoto(url: string){
    this.user.photoUrl = url;
  }

}
