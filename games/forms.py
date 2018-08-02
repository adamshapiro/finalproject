from django import forms
from django.contrib.auth.models import User

class LoginForm(forms.Form):
    # Use widgets to attach ids and classes to fields
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'id': 'inputUsername',
            'class': 'form-control col-sm-6'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'id': 'inputPassword',
            'class': 'form-control col-sm-6'
        })
    )

# RegisterForm adds more fields to the LoginForm for first time users
class RegisterForm(LoginForm):
    confirm = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(attrs={
            'id': 'inputConfirm',
            'class': 'form-control col-sm-6'
        }),
        help_text='Re-enter your password here.'
    )
    first_name = forms.CharField(
        label='First Name',
        widget=forms.TextInput(attrs={
            'id': 'inputFirstName',
            'class': 'form-control col-sm-6'
        })
    )
    last_name = forms.CharField(
        label='Last Name',
        widget=forms.TextInput(attrs={
            'id': 'inputLastName',
            'class': 'form-control col-sm-6'
        })
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'id': 'inputEmail',
            'class': 'form-control col-sm-6'
        })
    )

    # Make sure the username is not taken
    def clean_username(self):
        data = self.cleaned_data['username']

        user = User.objects.filter(username__iexact=data)
        if len(user) > 0:
            raise forms.ValidationError("That username is taken")

        return data


    # validate that password and confirm are the same
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm = cleaned_data.get('confirm')

        if password and confirm and password != confirm:
            pw_err = forms.ValidationError('Your password and confirmation do not match.')
            self.add_error('confirm', pw_err)
