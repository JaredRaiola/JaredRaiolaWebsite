"use strict";
(self["webpackChunkJaredRaiolaFirebaseWebsite"] = self["webpackChunkJaredRaiolaFirebaseWebsite"] || []).push([["main"],{

/***/ 2399:
/*!******************************************!*\
  !*** ./src/app/alert/alert.component.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlertComponent: () => (/* binding */ AlertComponent)
/* harmony export */ });
/* harmony import */ var _models_alert__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../models/alert */ 6916);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 1699);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 6575);



function AlertComponent_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 7)(1, "button", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function AlertComponent_div_9_Template_button_click_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r2);
      const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r1.ok());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "Ok");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
}
class AlertComponent {
  constructor() {
    this.alertContent = {
      title: '',
      body: '',
      optionType: _models_alert__WEBPACK_IMPORTED_MODULE_0__.AlertOptions.Ok
    };
    this.hidden = false;
  }
  get AlertOptions() {
    return _models_alert__WEBPACK_IMPORTED_MODULE_0__.AlertOptions;
  }
  x() {
    console.log("hide");
    this.hidden = true;
  }
  ok() {
    console.log("hide");
    this.hidden = true;
  }
  static #_ = this.ɵfac = function AlertComponent_Factory(t) {
    return new (t || AlertComponent)();
  };
  static #_2 = this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
    type: AlertComponent,
    selectors: [["app-alert"]],
    inputs: {
      alertContent: "alertContent"
    },
    decls: 10,
    vars: 3,
    consts: [[1, "alert-window"], [1, "alert-title-container"], [1, "alert-title"], [1, "alert-x", "alert-button-container", 3, "click"], [1, "alert-body-container"], [1, "alert-body"], ["class", "alert-button-container alert-options", 4, "ngIf"], [1, "alert-button-container", "alert-options"], [1, "alert-button", 3, "click"]],
    template: function AlertComponent_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0)(1, "div", 1)(2, "div", 2);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "div", 3);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function AlertComponent_Template_div_click_4_listener() {
          return ctx.x();
        });
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5, "X");
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "div", 4)(7, "div", 5);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](8);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](9, AlertComponent_div_9_Template, 3, 0, "div", 6);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
      }
      if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](ctx.alertContent.title);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](ctx.alertContent.body);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.alertContent.optionType == ctx.AlertOptions.Ok);
      }
    },
    dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_2__.NgIf],
    styles: [".alert-window[_ngcontent-%COMP%] {\n    margin: auto;\n    max-width: 500px;\n    border-top: 2px solid white;\n    border-left: 2px solid white;\n    border-bottom: 2px solid rgb(133, 135, 139);\n    border-right: 2px solid rgb(133, 135, 139);\n    background-color: rgb(194, 194, 194);\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n}\n\n.alert-title-container[_ngcontent-%COMP%] {\n    background-color: rgb(8, 8, 132);\n    display: flex;\n    width: 100%;\n    justify-content: space-between;\n    align-items: center;\n}\n\n.alert-title[_ngcontent-%COMP%] {\n    color: white;\n    margin-left: 2px;\n}\n\n.alert-x[_ngcontent-%COMP%] {\n    cursor: pointer;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    font-size: 10px;\n    width: 12px;\n    height: 12px;\n    margin-right: 2px;\n}\n\n.alert-body-container[_ngcontent-%COMP%] {\n    color: black;\n    display: flex;\n    width: 100%;\n    justify-content: center;\n    align-items: center;\n    flex-direction: column;\n}\n\n.alert-body[_ngcontent-%COMP%] {\n    margin: 10px;\n}\n\n.alert-options[_ngcontent-%COMP%] {\n    margin: 10px;\n}\n\n.alert-button-container[_ngcontent-%COMP%] {\n    background-color: rgb(194, 194, 194);\n    border-top: 2px solid white;\n    border-left: 2px solid white;\n    border-bottom: 2px solid rgb(133, 135, 139);\n    border-right: 2px solid rgb(133, 135, 139);\n}\n\n.alert-button-container[_ngcontent-%COMP%]:active {\n    border-top: 2px solid black;\n    border-left: 2px solid black;\n    border-bottom: 2px solid black;\n    border-right: 2px solid black;\n}\n\n.alert-button[_ngcontent-%COMP%] {\n    cursor: pointer;\n    margin: 1px;\n    background-color: rgb(194, 194, 194);\n    border: 1px solid rgb(194, 194, 194);\n}\n\n.alert-button[_ngcontent-%COMP%]:active {\n    border: 1px dotted;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWxlcnQvYWxlcnQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtJQUNJLFlBQVk7SUFDWixnQkFBZ0I7SUFDaEIsMkJBQTJCO0lBQzNCLDRCQUE0QjtJQUM1QiwyQ0FBMkM7SUFDM0MsMENBQTBDO0lBQzFDLG9DQUFvQztJQUNwQyxtQkFBbUI7SUFDbkIsdUJBQXVCO0lBQ3ZCLGtCQUFrQjtBQUN0Qjs7QUFFQTtJQUNJLGdDQUFnQztJQUNoQyxhQUFhO0lBQ2IsV0FBVztJQUNYLDhCQUE4QjtJQUM5QixtQkFBbUI7QUFDdkI7O0FBRUE7SUFDSSxZQUFZO0lBQ1osZ0JBQWdCO0FBQ3BCOztBQUVBO0lBQ0ksZUFBZTtJQUNmLGFBQWE7SUFDYix1QkFBdUI7SUFDdkIsbUJBQW1CO0lBQ25CLGVBQWU7SUFDZixXQUFXO0lBQ1gsWUFBWTtJQUNaLGlCQUFpQjtBQUNyQjs7QUFFQTtJQUNJLFlBQVk7SUFDWixhQUFhO0lBQ2IsV0FBVztJQUNYLHVCQUF1QjtJQUN2QixtQkFBbUI7SUFDbkIsc0JBQXNCO0FBQzFCOztBQUVBO0lBQ0ksWUFBWTtBQUNoQjs7QUFFQTtJQUNJLFlBQVk7QUFDaEI7O0FBRUE7SUFDSSxvQ0FBb0M7SUFDcEMsMkJBQTJCO0lBQzNCLDRCQUE0QjtJQUM1QiwyQ0FBMkM7SUFDM0MsMENBQTBDO0FBQzlDOztBQUVBO0lBQ0ksMkJBQTJCO0lBQzNCLDRCQUE0QjtJQUM1Qiw4QkFBOEI7SUFDOUIsNkJBQTZCO0FBQ2pDOztBQUVBO0lBQ0ksZUFBZTtJQUNmLFdBQVc7SUFDWCxvQ0FBb0M7SUFDcEMsb0NBQW9DO0FBQ3hDOztBQUVBO0lBQ0ksa0JBQWtCO0FBQ3RCIiwic291cmNlc0NvbnRlbnQiOlsiLmFsZXJ0LXdpbmRvdyB7XHJcbiAgICBtYXJnaW46IGF1dG87XHJcbiAgICBtYXgtd2lkdGg6IDUwMHB4O1xyXG4gICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkIHdoaXRlO1xyXG4gICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCB3aGl0ZTtcclxuICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCByZ2IoMTMzLCAxMzUsIDEzOSk7XHJcbiAgICBib3JkZXItcmlnaHQ6IDJweCBzb2xpZCByZ2IoMTMzLCAxMzUsIDEzOSk7XHJcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IoMTk0LCAxOTQsIDE5NCk7XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XHJcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbn1cclxuXHJcbi5hbGVydC10aXRsZS1jb250YWluZXIge1xyXG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKDgsIDgsIDEzMik7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgd2lkdGg6IDEwMCU7XHJcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG59XHJcblxyXG4uYWxlcnQtdGl0bGUge1xyXG4gICAgY29sb3I6IHdoaXRlO1xyXG4gICAgbWFyZ2luLWxlZnQ6IDJweDtcclxufVxyXG5cclxuLmFsZXJ0LXgge1xyXG4gICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xyXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgIGZvbnQtc2l6ZTogMTBweDtcclxuICAgIHdpZHRoOiAxMnB4O1xyXG4gICAgaGVpZ2h0OiAxMnB4O1xyXG4gICAgbWFyZ2luLXJpZ2h0OiAycHg7XHJcbn1cclxuXHJcbi5hbGVydC1ib2R5LWNvbnRhaW5lciB7XHJcbiAgICBjb2xvcjogYmxhY2s7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgd2lkdGg6IDEwMCU7XHJcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcclxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG59XHJcblxyXG4uYWxlcnQtYm9keSB7XHJcbiAgICBtYXJnaW46IDEwcHg7XHJcbn1cclxuXHJcbi5hbGVydC1vcHRpb25zIHtcclxuICAgIG1hcmdpbjogMTBweDtcclxufVxyXG5cclxuLmFsZXJ0LWJ1dHRvbi1jb250YWluZXIge1xyXG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKDE5NCwgMTk0LCAxOTQpO1xyXG4gICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkIHdoaXRlO1xyXG4gICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCB3aGl0ZTtcclxuICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCByZ2IoMTMzLCAxMzUsIDEzOSk7XHJcbiAgICBib3JkZXItcmlnaHQ6IDJweCBzb2xpZCByZ2IoMTMzLCAxMzUsIDEzOSk7XHJcbn1cclxuXHJcbi5hbGVydC1idXR0b24tY29udGFpbmVyOmFjdGl2ZSB7XHJcbiAgICBib3JkZXItdG9wOiAycHggc29saWQgYmxhY2s7XHJcbiAgICBib3JkZXItbGVmdDogMnB4IHNvbGlkIGJsYWNrO1xyXG4gICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkIGJsYWNrO1xyXG4gICAgYm9yZGVyLXJpZ2h0OiAycHggc29saWQgYmxhY2s7XHJcbn1cclxuXHJcbi5hbGVydC1idXR0b24ge1xyXG4gICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgbWFyZ2luOiAxcHg7XHJcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2IoMTk0LCAxOTQsIDE5NCk7XHJcbiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2IoMTk0LCAxOTQsIDE5NCk7XHJcbn1cclxuXHJcbi5hbGVydC1idXR0b246YWN0aXZlIHtcclxuICAgIGJvcmRlcjogMXB4IGRvdHRlZDtcclxufSJdLCJzb3VyY2VSb290IjoiIn0= */"]
  });
}

/***/ }),

/***/ 6401:
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AppComponent: () => (/* binding */ AppComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 6575);
/* harmony import */ var _models_alert__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./models/alert */ 6916);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 1699);
/* harmony import */ var _alert_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./alert/alert.component */ 2399);





class AppComponent {
  constructor() {
    this.localDateTime = new Date();
    this.desktopAlert = {
      title: 'Welcome!',
      body: 'This is a Windows 98 inspired personal website created by Jared Raiola. It is currently a work in progress, not all features are implemented yet! Feel free to explore and learn more about me!',
      optionType: _models_alert__WEBPACK_IMPORTED_MODULE_0__.AlertOptions.Ok
    };
    setInterval(() => {
      this.localDateTime = new Date();
    }, 1);
  }
  getTime() {
    return (0,_angular_common__WEBPACK_IMPORTED_MODULE_2__.formatDate)(this.localDateTime, "hh:mm:ss", "en-US");
  }
  static #_ = this.ɵfac = function AppComponent_Factory(t) {
    return new (t || AppComponent)();
  };
  static #_2 = this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
    type: AppComponent,
    selectors: [["app-root"]],
    decls: 38,
    vars: 6,
    consts: [[1, "desktop"], [1, "alert", 3, "alertContent", "hidden"], ["windowAlert", ""], ["id", "icon-col-one", 1, "icons"], [1, "icon"], ["id", "recycle", "src", "../assets/Windows 98 Imgs/png/recycle_bin_empty-0.png", 1, "unhighlightable"], ["for", "recycle", 1, "label"], ["id", "resume", "src", "../assets/Windows 98 Imgs/png/document-0.png", 1, "unhighlightable"], ["for", "resume", 1, "label"], ["href", "https://www.linkedin.com/in/jared-raiola/", "target", "_blank"], ["id", "linkedin", "src", "../assets/misc/linkedin.png", 1, "unhighlightable"], ["for", "linkedin", 1, "label"], ["href", "https://github.com/JaredRaiola", "target", "_blank"], ["id", "github", "src", "../assets/misc/github.png", 1, "unhighlightable"], ["for", "github", 1, "label"], ["id", "todo", "src", "../assets/Windows 98 Imgs/png/document-0.png", 1, "unhighlightable"], ["for", "todo", 1, "label"], ["id", "taskbar", 1, "taskbar"], [1, "taskbar-left-section"], ["id", "start", 1, "start-button"], ["src", "../assets/Windows 98 Imgs/png/start_icon.png", 1, "start_icon", "unhighlightable"], [1, "taskbar-border"], ["id", "time", 1, "taskbar-center-section"], [1, "taskbar-right-section"], [1, "taskbar-right-section-container"], ["id", "time", 1, "time", "unhighlightable"]],
    template: function AppComponent_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](1, "app-alert", 1, 2);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 3)(4, "div", 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](5, "img", 5);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "div", 6);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](7, "Recycle Bin");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "div", 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](9, "img", 7);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "div", 8);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11, "My Resume");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "a", 9)(13, "div", 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](14, "img", 10);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "div", 11);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16, "LinkedIn");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "a", 12)(18, "div", 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](19, "img", 13);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "div", 14);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](21, "GitHub");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](22, "div", 4);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](23, "img", 15);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](24, "div", 16);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](25, "To Do List");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](26, "div", 17)(27, "div", 18)(28, "div", 19);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](29, "img", 20);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](30, "div", 21);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](31, "div", 22);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](32, "div", 23);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](33, "div", 21);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](34, "div", 24)(35, "div", 25);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](36);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](37, "date");
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
      }
      if (rf & 2) {
        const _r0 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵreference"](2);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("alertContent", ctx.desktopAlert)("hidden", _r0 == null ? null : _r0.hidden);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](35);
        _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind2"](37, 3, ctx.localDateTime, "shortTime"));
      }
    },
    dependencies: [_alert_alert_component__WEBPACK_IMPORTED_MODULE_1__.AlertComponent, _angular_common__WEBPACK_IMPORTED_MODULE_2__.DatePipe],
    styles: [".desktop[_ngcontent-%COMP%] {\n    display: flex;\n    flex-grow: 1;\n  }\n  \n  .icons[_ngcontent-%COMP%] {\n    display: flex;\n    position: fixed;\n    flex-direction: column;\n    margin: 1%;\n  }\n  \n  \n  \n\n  .icon[_ngcontent-%COMP%] {\n    margin: 10px;\n    cursor: pointer;\n    display: flex;\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n  }\n  \n  .icon[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n    width: 32px;\n    height: 32px;\n  }\n  \n  \n  \n  \n  \n  \n\n  \n  .taskbar[_ngcontent-%COMP%] {\n    position: fixed;\n    display: flex;\n    bottom: 0;\n    height: 4%;\n    max-height: 40px;\n    width: 100%;\n    align-items: center;\n    background-color: rgb(194, 194, 194);\n    border-top: 2px solid white;\n  }\n  \n  .taskbar-border[_ngcontent-%COMP%] {\n    display: flex;\n    flex-grow: 1;\n    position: relative;\n    margin-left: 3px;\n    margin-right: 3px;\n    border-left: 1px solid rgb(133, 135, 139);\n    border-right: 1px solid white;\n    height: 100%;\n  }\n  \n  .taskbar-left-section[_ngcontent-%COMP%] {\n    display: flex;\n    margin-left: 0.25%;\n    height: 85%;\n  }\n  \n  .start-button[_ngcontent-%COMP%] {\n    cursor: pointer;\n    display: flex;\n    position: relative;\n    justify-content: center;\n    align-items: center;\n    border-top: 2px solid white;\n    border-left: 2px solid white;\n    border-bottom: 2px solid rgb(133, 135, 139);\n    border-right: 2px solid rgb(133, 135, 139);\n    padding-left: 10px;\n    padding-right: 10px;\n  }\n  \n  .start-button[_ngcontent-%COMP%]:active {\n    border-top: 2px solid rgb(133, 135, 139);\n    border-left: 2px solid rgb(133, 135, 139);\n    border-bottom: 2px solid white;\n    border-right: 2px solid white;\n  }\n  \n  .start_icon[_ngcontent-%COMP%] {\n    z-index: -999;\n    max-width: 80px;\n    height: 100%;\n  }\n  \n  .taskbar-right-section[_ngcontent-%COMP%] {\n    position: absolute;\n    display: flex;\n    right:0.25%;\n    height: 85%;\n  }\n  \n  .taskbar-right-section-container[_ngcontent-%COMP%] {\n    cursor: pointer;\n    height: 85%;\n    display: flex;\n    text-align: center;\n    align-items: center;\n    border-top: 2px solid rgb(133, 135, 139);\n    border-left: 2px solid rgb(133, 135, 139);\n    border-bottom: 2px solid white;\n    border-right: 2px solid white;\n    padding-left: 10px;\n    padding-right: 10px;\n  }\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYXBwLmNvbXBvbmVudC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7SUFDSSxhQUFhO0lBQ2IsWUFBWTtFQUNkOztFQUVBO0lBQ0UsYUFBYTtJQUNiLGVBQWU7SUFDZixzQkFBc0I7SUFDdEIsVUFBVTtFQUNaOzs7RUFHQSxhQUFhO0VBQ2I7SUFDRSxZQUFZO0lBQ1osZUFBZTtJQUNmLGFBQWE7SUFDYixzQkFBc0I7SUFDdEIsdUJBQXVCO0lBQ3ZCLG1CQUFtQjtFQUNyQjs7RUFFQTtJQUNFLFdBQVc7SUFDWCxZQUFZO0VBQ2Q7Ozs7OztFQU1BLGdCQUFnQjs7RUFFaEI7SUFDRSxlQUFlO0lBQ2YsYUFBYTtJQUNiLFNBQVM7SUFDVCxVQUFVO0lBQ1YsZ0JBQWdCO0lBQ2hCLFdBQVc7SUFDWCxtQkFBbUI7SUFDbkIsb0NBQW9DO0lBQ3BDLDJCQUEyQjtFQUM3Qjs7RUFFQTtJQUNFLGFBQWE7SUFDYixZQUFZO0lBQ1osa0JBQWtCO0lBQ2xCLGdCQUFnQjtJQUNoQixpQkFBaUI7SUFDakIseUNBQXlDO0lBQ3pDLDZCQUE2QjtJQUM3QixZQUFZO0VBQ2Q7O0VBRUE7SUFDRSxhQUFhO0lBQ2Isa0JBQWtCO0lBQ2xCLFdBQVc7RUFDYjs7RUFFQTtJQUNFLGVBQWU7SUFDZixhQUFhO0lBQ2Isa0JBQWtCO0lBQ2xCLHVCQUF1QjtJQUN2QixtQkFBbUI7SUFDbkIsMkJBQTJCO0lBQzNCLDRCQUE0QjtJQUM1QiwyQ0FBMkM7SUFDM0MsMENBQTBDO0lBQzFDLGtCQUFrQjtJQUNsQixtQkFBbUI7RUFDckI7O0VBRUE7SUFDRSx3Q0FBd0M7SUFDeEMseUNBQXlDO0lBQ3pDLDhCQUE4QjtJQUM5Qiw2QkFBNkI7RUFDL0I7O0VBRUE7SUFDRSxhQUFhO0lBQ2IsZUFBZTtJQUNmLFlBQVk7RUFDZDs7RUFFQTtJQUNFLGtCQUFrQjtJQUNsQixhQUFhO0lBQ2IsV0FBVztJQUNYLFdBQVc7RUFDYjs7RUFFQTtJQUNFLGVBQWU7SUFDZixXQUFXO0lBQ1gsYUFBYTtJQUNiLGtCQUFrQjtJQUNsQixtQkFBbUI7SUFDbkIsd0NBQXdDO0lBQ3hDLHlDQUF5QztJQUN6Qyw4QkFBOEI7SUFDOUIsNkJBQTZCO0lBQzdCLGtCQUFrQjtJQUNsQixtQkFBbUI7RUFDckIiLCJzb3VyY2VzQ29udGVudCI6WyIuZGVza3RvcCB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgZmxleC1ncm93OiAxO1xyXG4gIH1cclxuICBcclxuICAuaWNvbnMge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIHBvc2l0aW9uOiBmaXhlZDtcclxuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICBtYXJnaW46IDElO1xyXG4gIH1cclxuICBcclxuICBcclxuICAvKiBpY29uIGNzcyAqL1xyXG4gIC5pY29uIHtcclxuICAgIG1hcmdpbjogMTBweDtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gIH1cclxuICBcclxuICAuaWNvbiBpbWcge1xyXG4gICAgd2lkdGg6IDMycHg7XHJcbiAgICBoZWlnaHQ6IDMycHg7XHJcbiAgfVxyXG4gIFxyXG4gIFxyXG4gIFxyXG4gIFxyXG4gIFxyXG4gIC8qIHRhc2tiYXIgY3NzICovXHJcbiAgXHJcbiAgLnRhc2tiYXIge1xyXG4gICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGJvdHRvbTogMDtcclxuICAgIGhlaWdodDogNCU7XHJcbiAgICBtYXgtaGVpZ2h0OiA0MHB4O1xyXG4gICAgd2lkdGg6IDEwMCU7XHJcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiKDE5NCwgMTk0LCAxOTQpO1xyXG4gICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkIHdoaXRlO1xyXG4gIH1cclxuICBcclxuICAudGFza2Jhci1ib3JkZXIge1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIGZsZXgtZ3JvdzogMTtcclxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgIG1hcmdpbi1sZWZ0OiAzcHg7XHJcbiAgICBtYXJnaW4tcmlnaHQ6IDNweDtcclxuICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgcmdiKDEzMywgMTM1LCAxMzkpO1xyXG4gICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgd2hpdGU7XHJcbiAgICBoZWlnaHQ6IDEwMCU7XHJcbiAgfVxyXG4gIFxyXG4gIC50YXNrYmFyLWxlZnQtc2VjdGlvbiB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgbWFyZ2luLWxlZnQ6IDAuMjUlO1xyXG4gICAgaGVpZ2h0OiA4NSU7XHJcbiAgfVxyXG4gIFxyXG4gIC5zdGFydC1idXR0b24ge1xyXG4gICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xyXG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgIGJvcmRlci10b3A6IDJweCBzb2xpZCB3aGl0ZTtcclxuICAgIGJvcmRlci1sZWZ0OiAycHggc29saWQgd2hpdGU7XHJcbiAgICBib3JkZXItYm90dG9tOiAycHggc29saWQgcmdiKDEzMywgMTM1LCAxMzkpO1xyXG4gICAgYm9yZGVyLXJpZ2h0OiAycHggc29saWQgcmdiKDEzMywgMTM1LCAxMzkpO1xyXG4gICAgcGFkZGluZy1sZWZ0OiAxMHB4O1xyXG4gICAgcGFkZGluZy1yaWdodDogMTBweDtcclxuICB9XHJcbiAgXHJcbiAgLnN0YXJ0LWJ1dHRvbjphY3RpdmUge1xyXG4gICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkIHJnYigxMzMsIDEzNSwgMTM5KTtcclxuICAgIGJvcmRlci1sZWZ0OiAycHggc29saWQgcmdiKDEzMywgMTM1LCAxMzkpO1xyXG4gICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkIHdoaXRlO1xyXG4gICAgYm9yZGVyLXJpZ2h0OiAycHggc29saWQgd2hpdGU7XHJcbiAgfVxyXG4gIFxyXG4gIC5zdGFydF9pY29uIHtcclxuICAgIHotaW5kZXg6IC05OTk7XHJcbiAgICBtYXgtd2lkdGg6IDgwcHg7XHJcbiAgICBoZWlnaHQ6IDEwMCU7XHJcbiAgfVxyXG4gIFxyXG4gIC50YXNrYmFyLXJpZ2h0LXNlY3Rpb24ge1xyXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIHJpZ2h0OjAuMjUlO1xyXG4gICAgaGVpZ2h0OiA4NSU7XHJcbiAgfVxyXG4gIFxyXG4gIC50YXNrYmFyLXJpZ2h0LXNlY3Rpb24tY29udGFpbmVyIHtcclxuICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgIGhlaWdodDogODUlO1xyXG4gICAgZGlzcGxheTogZmxleDtcclxuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAgICBib3JkZXItdG9wOiAycHggc29saWQgcmdiKDEzMywgMTM1LCAxMzkpO1xyXG4gICAgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCByZ2IoMTMzLCAxMzUsIDEzOSk7XHJcbiAgICBib3JkZXItYm90dG9tOiAycHggc29saWQgd2hpdGU7XHJcbiAgICBib3JkZXItcmlnaHQ6IDJweCBzb2xpZCB3aGl0ZTtcclxuICAgIHBhZGRpbmctbGVmdDogMTBweDtcclxuICAgIHBhZGRpbmctcmlnaHQ6IDEwcHg7XHJcbiAgfSJdLCJzb3VyY2VSb290IjoiIn0= */"]
  });
}

/***/ }),

/***/ 8629:
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AppModule: () => (/* binding */ AppModule)
/* harmony export */ });
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/platform-browser */ 6480);
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app.component */ 6401);
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/platform-browser/animations */ 4987);
/* harmony import */ var _alert_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./alert/alert.component */ 2399);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ 1699);





class AppModule {
  static #_ = this.ɵfac = function AppModule_Factory(t) {
    return new (t || AppModule)();
  };
  static #_2 = this.ɵmod = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineNgModule"]({
    type: AppModule,
    bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_0__.AppComponent]
  });
  static #_3 = this.ɵinj = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjector"]({
    imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__.BrowserModule, _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__.BrowserAnimationsModule]
  });
}
(function () {
  (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppModule, {
    declarations: [_app_component__WEBPACK_IMPORTED_MODULE_0__.AppComponent, _alert_alert_component__WEBPACK_IMPORTED_MODULE_1__.AlertComponent],
    imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__.BrowserModule, _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__.BrowserAnimationsModule]
  });
})();

/***/ }),

/***/ 6916:
/*!*********************************!*\
  !*** ./src/app/models/alert.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlertOptions: () => (/* binding */ AlertOptions)
/* harmony export */ });
var AlertOptions;
(function (AlertOptions) {
  AlertOptions[AlertOptions["Ok"] = 1] = "Ok";
  AlertOptions[AlertOptions["YesNo"] = 2] = "YesNo";
})(AlertOptions || (AlertOptions = {}));

/***/ }),

/***/ 4913:
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ 6480);
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app/app.module */ 8629);


_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__.platformBrowser().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_0__.AppModule).catch(err => console.error(err));

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["vendor"], () => (__webpack_exec__(4913)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=main.js.map