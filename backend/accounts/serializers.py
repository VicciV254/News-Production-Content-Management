from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token
from .models import User


class UserSerializer(serializers.ModelSerializer):
    initials = serializers.CharField(source='get_initials', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'initials', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password', 'role']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'is_active', 'current_password', 'new_password']

    def validate(self, data):
        if 'new_password' in data and not data.get('current_password'):
            raise serializers.ValidationError({'current_password': 'Current password is required to change password.'})
        if 'current_password' in data:
            user = self.context['request'].user
            if not user.check_password(data['current_password']):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})
        return data

    def update(self, instance, validated_data):
        validated_data.pop('current_password', None)
        new_password = validated_data.pop('new_password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        data['user'] = user
        return data

    def create(self, validated_data):
        user = validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return {'token': token.key, 'user': UserSerializer(user).data}
