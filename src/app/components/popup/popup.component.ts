import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnChanges {
  @Input() popupInfo: any;
  @Input() position: any;

  constructor() { }

  ngOnChanges(): void {
    console.log(this.popupInfo, this.position)
  }
}
