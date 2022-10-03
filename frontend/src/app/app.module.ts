import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TmpButtonComponent } from './tmp-button/tmp-button.component';
import {HttpClientModule} from "@angular/common/http";
import { TestTableComponent } from './test-table/test-table.component';
import { LeftMenuComponent } from './left-menu/left-menu.component';
import {MenuService} from "./comm/MenuService";

@NgModule({
  declarations: [
    AppComponent,
    TmpButtonComponent,
    TestTableComponent,
    LeftMenuComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [MenuService],
  bootstrap: [AppComponent]
})
export class AppModule { }
