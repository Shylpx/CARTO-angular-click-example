import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public popupInfo: any = null;
  public position: any = [0, 0];

  constructor() {}

  handlePositionUpdate (event: any) {
    this.position = { ...event }
  }
  handlePopupInfoUpdate (event: any) {
    this.popupInfo = { ...event }
  }
}
