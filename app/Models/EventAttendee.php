<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class EventAttendee extends Model
{
    protected $table = 'event_attendees';
    public $timestamps = false;
    
    protected $fillable = ['eventId', 'userId', 'joinedAt'];
    protected function casts(): array
    {
        return ['joinedAt' => 'datetime'];
    }
    public function event()
    {
        return $this->belongsTo(Event::class, 'eventId');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
