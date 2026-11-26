<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Event extends Model
{
    use SoftDeletes;
    protected $table = 'events';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['startsAt' => 'datetime', 'endsAt' => 'datetime'];
    }
    public function group()
    {
        return $this->belongsTo(Group::class, 'groupId');
    }
    public function host()
    {
        return $this->belongsTo(User::class, 'hostId');
    }
    public function attendees()
    {
        return $this->hasMany(EventAttendee::class, 'eventId');
    }
    public function participants()
    {
        return $this->belongsToMany(User::class, 'event_attendees', 'eventId', 'userId')->withPivot(['id', 'joinedAt']);
    }
}
