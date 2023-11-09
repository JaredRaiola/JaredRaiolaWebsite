import { Component, Input } from '@angular/core';
import { IAlert, AlertOptions } from '../models/alert';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  @Input() alertContent: IAlert = {
    title: '',
    body: '',
    optionType: AlertOptions.Ok
  };
  public hidden: boolean = false;

  constructor() {
  }

  get AlertOptions(): typeof AlertOptions {
    return AlertOptions;
  }

  x() {
    console.log("hide")
    this.hidden = true;
  }

  ok() {
    console.log("hide")
    this.hidden = true;
  }
}
