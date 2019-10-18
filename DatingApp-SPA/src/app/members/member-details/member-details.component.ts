import { AlertifyjsService } from './../../_services/alertifyjs.service';
import { UserService } from './../../_services/user.service';
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/_models/user';
import { ActivatedRoute } from '@angular/router';
import { NgxGalleryOptions, NgxGalleryImage, NgxGalleryAnimation } from 'ngx-gallery';

@Component({
  selector: 'app-member-details',
  templateUrl: './member-details.component.html',
  styleUrls: ['./member-details.component.css']
})
export class MemberDetailsComponent implements OnInit {
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];
  user: User;

  constructor(
    private userService: UserService,
    private alertify: AlertifyjsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.user = data['user'];
    });

    this.galleryOptions = [
      {
        width: '500px',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false
      }
    ];

    this.galleryImages = this.getImages();

  }

  getImages(){
    const imageUrls = [];
    for (const photo of this.user.photos) {
      imageUrls.push({
        small: photo.url,
        medium: photo.url,
        big: photo.url,
        description: photo.description
      });
    }
    return imageUrls;
  }

  // members/2 --> to get the id from the url, we have to activateRoute
/*   loadUser() {
    // + is to convert the id to a number
    this.userService.getUser(+this.route.snapshot.params['id'])
    .subscribe((user: User) => {
      this.user = user;
    },error => {
      this.alertify.error(error);
    });

  } */
}
