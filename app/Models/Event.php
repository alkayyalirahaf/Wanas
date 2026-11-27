<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Event extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $table = 'events';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['startsAt' => 'datetime', 'endsAt' => 'datetime'];
    }


    /**
     * @return BelongsTo<Group, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'groupId');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hostId');
    }

    /**
     * @return HasMany<EventAttendee, $this>
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(EventAttendee::class, 'eventId');
    }
    public function participants()
    {
        return $this->belongsToMany(User::class, 'event_attendees', 'eventId', 'userId')->withPivot(['id', 'joinedAt']);
    }
}
