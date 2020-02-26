import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';

import { AuthGuardService } from './services/auth-guard.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { CreateUserComponent } from './create-user/create-user.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'user/profile/:id',
        component: UserProfileComponent,
      },
      {
        path: 'users/create',
        component: CreateUserComponent,
      },
      {
        path: '',
        component: DashboardComponent,
      },
    ]},
  { path: 'forgotPassword', component: ForgotPasswordComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
