import { AuthService } from './../../_services/auth.service';
import { Component, OnInit, Input } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyjsService } from 'src/app/_services/alertifyjs.service';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs/operators';
import { MessagesComponent } from 'src/app/messages/messages.component';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit {
  @Input() recipientId: number;
  messages: Message[];
  newMessage : any = {};

  constructor(private userService: UserService, 
    private alertify: AlertifyjsService, private route: ActivatedRoute, private authService: AuthService) {
  }

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    const currentUserId = +this.authService.decodedToken.nameid;
    this.userService.getMessageThread(this.authService.decodedToken.nameid, this.recipientId)
    .pipe(
      tap(messages => {
        for(let i = 0; i < messages.length; i++) {
          if(messages[i].isRead === false && messages[i].recipientId === currentUserId) {
            this.userService.markMessageAsRead(messages[i].id, currentUserId);
          }
        }
      })
    )
    .subscribe(messages => {
      this.messages = messages;
      console.log(this.messages);
    }, error => {
      this.alertify.error(error);
    });
    }

  sendMessage() {
    // we create the object newMessage with what we need to create a new Message
    this.newMessage.recipientId = this.recipientId;
    this.newMessage.userId = this.authService.decodedToken.nameid;
    /*this.newMessage.senderKnownAs = this.authService.currentUser.knownAs;
    this.newMessage.senderPhotoUrl = this.authService.currentPhotoUrl;*/
    this.userService.sendMessage(this.authService.decodedToken.nameid, this.newMessage)
      .subscribe((message: Message) => {
        this.messages.unshift(message);
        console.log(this.messages);
        // reset the form:
        this.newMessage.content = '';
      }, error => {
        this.alertify.error(error);
      });
  }

}
