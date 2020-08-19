import { Component, ViewRef } from '@angular/core';
import { HsDialogComponent } from 'hslayers-ng/components/layout/dialogs/dialog-component.interface';

@Component({
    selector: 'info',
    template: require('./info.html'),
})
export class InfoDialogComponent implements HsDialogComponent {

        constructor(){}
    viewRef: ViewRef;
    data: any;
}