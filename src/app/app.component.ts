import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { AlertOptions, IAlert } from './models/alert';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public localDateTime: Date = new Date();
  public desktopAlert: IAlert = {
    title: 'Welcome!',
    body: 'This is a Windows 98 inspired personal website created by Jared Raiola. Feel free to explore and learn more about me!',
    optionType: AlertOptions.Ok
  };

  constructor() {
      setInterval(() => {
        this.localDateTime = new Date();
      }, 1);
  }

  getTime() {
    return formatDate(this.localDateTime, "hh:mm:ss", "en-US");
  }
}
