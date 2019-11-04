import { PaginatedResult } from './../../_models/pagination';
import { AlertifyjsService } from '../../_services/alertifyjs.service';
import { UserService } from '../../_services/user.service';
import { Component, OnInit } from '@angular/core';
import { User } from '../../_models/user';
import { ActivatedRoute } from '@angular/router';
import { Pagination } from 'src/app/_models/pagination';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css']
})
export class MemberListComponent implements OnInit {
  users: User[];
  user: User = JSON.parse(localStorage.getItem('user'));

  // options for the "option" controller in the template:
  genderList = [{value:'male', display:'Males'},{value:'female', display:'Females'}];

  // object with properties for filtering to be read by template:
  userParams: any = {};

  pagination: Pagination;

  constructor(
    private userService: UserService,
    private alertify: AlertifyjsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.users = data['users'].result;
      this.pagination = data['users'].pagination;
    });
    this.userParams.gender = this.user.gender === 'female' ? 'male' : 'female';
    this.userParams.minAge = 18;
    this.userParams.maxAge = 99;
    this.userParams.orderBy = 'lastActive';
    // this.loadUsers();
  }
  pageChanged(event: any): void {
    this.pagination.currentPage = event.page;
    this.loadUsers();
  }
  
    resetFilters(){
      this.userParams.gender = this.user.gender === 'female' ? 'male' : 'female';
      this.userParams.minAge = 18;
      this.userParams.maxAge = 99;
      this.userParams.orderBy = 'lastActive';
      this.loadUsers();
    }

   loadUsers() {
    this.userService.getUsers(this.pagination.currentPage,this.pagination.itemsPerPage, this.userParams).subscribe(
      (users: PaginatedResult<User[]>) => {
        this.users = users.result;
        this.pagination = users.pagination;
      },
      error => {
        this.alertify.error(error);
      }
    );
  } 
}
