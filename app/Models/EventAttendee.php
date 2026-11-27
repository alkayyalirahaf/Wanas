<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventAttendee extends Model
{
    use HasFactory;
    protected $table = 'event_attendees';
    public $timestamps = false;

    protected $fillable = ['eventId', 'userId', 'joinedAt'];
    protected function casts(): array
    {
        return ['joinedAt' => 'datetime'];
    }

    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'eventId');
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
