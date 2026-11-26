<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';


    protected $fillable = ['name', 'email', 'phoneNumber', 'password', 'role', 'status', 'profileImageUrl', 'bio'];
    protected $hidden = ['password', 'remember_token',
];

    protected function casts(): array
    {
        return ['password' => 'hashed' , 'email_verified_at' => 'datetime',];
    }


    public function verificationDocuments()
    {
        return $this->hasMany(VerificationDocument::class, 'userId');
    }
    public function specialistProfile()
    {
        return $this->hasOne(Specialist::class, 'userId');
    }
    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'ownerId');
    }
    public function memberships()
    {
        return $this->hasMany(Membership::class, 'userId');
    }
    public function eventsHosted()
    {
        return $this->hasMany(Event::class, 'hostId');
    }
    public function eventAttendances()
    {
        return $this->hasMany(EventAttendee::class, 'userId');
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'userId');
    }
    public function reports()
    {
        return $this->hasMany(Report::class, 'reporterId');
    }
    public function facilitatorApplications()
    {
        return $this->hasMany(FacilitatorApplication::class, 'userId');
    }
    public function reviewedFacilitatorApplications()
    {
        return $this->hasMany(FacilitatorApplication::class, 'reviewedBy');
    }
    public function inAppNotifications()
    {
        return $this->hasMany(AppNotification::class, 'userId');
    }
    public function aiSessions()
    {
        return $this->hasMany(AiSession::class, 'userId');
    }
}
