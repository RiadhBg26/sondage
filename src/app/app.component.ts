import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AuthenticationService } from './services/auth.service';
import { SurveyService } from './services/survey.service';
import { UserService } from './services/user.service';

import { NgxSpinnerService } from "ngx-spinner";

//@ts-ignore
import jwt_decode from 'jwt-decode';
import { AuthService, GoogleLoginProvider, SocialUser } from 'angularx-social-login';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'survey';
  id;
  user;
  surveys
  token;
  message: string
  isAuthed: boolean;
  timeout: number;
  socialUser: SocialUser;
  
  constructor(private surveyService: SurveyService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthenticationService,
    public authGuard: AuthGuard,
    private spinner: NgxSpinnerService,
    private socialAuthService: AuthService) {
  }

  ngOnInit(): void {
    //get user with id   
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      // let storedId = localStorage.setItem('id', JSON.stringify(this.id))
      this.userService.getSingleUser(this.id).subscribe(data => {
        this.user = data
        this.surveys = this.user.surveys
      });
    });
    //get user with token
    this.route.queryParamMap
      .subscribe(params => {
        this.token = params.get('token');
        this.token = localStorage.getItem('token');
        if (params.get('token') != this.token) {
          const urlTree = this.router.createUrlTree([], {
            queryParams: { token: this.token },
            queryParamsHandling: "merge",
            preserveFragment: true
          });
          this.router.navigateByUrl(urlTree);
        }
      });
    this.getSecuredRoute()
    // this.tokenDecode()
    // this.authService.checkToken()
    this.refresh()
  };


  getSecuredRoute() {
    this.userService.getSecuredRoute().subscribe(
      data => {
        this.message = data.message;
      },
      error => this.router.navigate(['/login'])
    )
  };

  tokenDecode() {
    var decodedToken = jwt_decode(this.token);
    // console.log(decodedToken);
    this.timeout = decodedToken.exp
    this.id = decodedToken.user._id
  };

  logout() {
    this.authService.logout()
  };

  refresh() {
    this.authService.refresh().subscribe(res => {
      if (res.error) {
        alert(res.error)
        this.authService.onDeleteUser()
      }
    })
  }

  google() {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID)
    // console.log(this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID));
    
    this.socialAuthService.authState.subscribe((user) => {
      this.socialUser = user;
      // console.log(this.socialUser);
      const token = this.socialUser.authToken
      const access_token = {token}
      this.userService.google(access_token.token).subscribe(res => {
        console.log('OAuth reponse => ', res.user._id);
        this.id = res.user._id
        console.log(access_token.token);
        localStorage.setItem('token', access_token.token.toString())
        localStorage.setItem('id', this.id.toString())
        this.router.navigate(['/add_survey'], {queryParams: {token: access_token.token}})
        
      })
      
    })
  }
}