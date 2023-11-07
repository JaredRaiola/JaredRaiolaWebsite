import { Component } from '@angular/core';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public localDateTime: Date = new Date();

  constructor() {
      setInterval(() => {
        this.localDateTime = new Date();
      }, 1);
  }

  getTime() {
    return formatDate(this.localDateTime, "hh:mm:ss", "en-US");
  }
}
