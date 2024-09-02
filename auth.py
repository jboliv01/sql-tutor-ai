# auth.py

from flask import Flask, request, jsonify, url_for, redirect, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from authlib.integrations.flask_client import OAuth
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Mail, Message

db = SQLAlchemy()
login_manager = LoginManager()
oauth = OAuth()
mail = Mail()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    name = db.Column(db.String(100))
    google_id = db.Column(db.String(100), unique=True, nullable=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def send_magic_link(email, token):
    msg = Message('Your Magic Link',
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[email])
    msg.body = f'Click this link to log in: {url_for("auth.verify_magic_link", token=token, _external=True)}'
    mail.send(msg)

def init_auth(app):
    db.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    mail.init_app(app)

    # Google OAuth setup
    oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        access_token_url='https://accounts.google.com/o/oauth2/token',
        access_token_params=None,
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        authorize_params=None,
        api_base_url='https://www.googleapis.com/oauth2/v1/',
        userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
        client_kwargs={'scope': 'openid email profile'},
    )

    from flask import Blueprint
    auth = Blueprint('auth', __name__)

    @auth.route('/login/email', methods=['POST'])
    def login_email():
        email = request.json.get('email')
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email)
            db.session.add(user)
            db.session.commit()
        
        serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
        token = serializer.dumps(email, salt='email-confirm')
        
        send_magic_link(email, token)
        return jsonify({"message": "Magic link sent to your email"}), 200

    @auth.route('/verify-magic-link/<token>')
    def verify_magic_link(token):
        serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
        try:
            email = serializer.loads(token, salt='email-confirm', max_age=3600)
        except:
            return jsonify({"error": "Invalid or expired token"}), 400
        
        user = User.query.filter_by(email=email).first()
        if user:
            login_user(user)
            return redirect(url_for('home'))
        else:
            return jsonify({"error": "User not found"}), 404

    @auth.route('/login/google')
    def google_login():
        redirect_uri = url_for('auth.google_authorize', _external=True)
        return oauth.google.authorize_redirect(redirect_uri)

    @auth.route('/login/google/callback')
    def google_authorize():
        token = oauth.google.authorize_access_token()
        resp = oauth.google.get('userinfo')
        user_info = resp.json()
        email = user_info['email']
        name = user_info['name']
        google_id = user_info['id']
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, name=name, google_id=google_id)
            db.session.add(user)
            db.session.commit()
        else:
            user.name = name
            user.google_id = google_id
            db.session.commit()
        
        login_user(user)
        return redirect(url_for('home'))

    @auth.route('/logout')
    @login_required
    def logout():
        logout_user()
        return jsonify({"message": "Logged out successfully"}), 200

    @auth.route('/profile')
    @login_required
    def profile():
        return jsonify({
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name
        }), 200

    app.register_blueprint(auth, url_prefix='/auth')

    return auth