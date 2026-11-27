<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class SpecialistSlot extends Model
{
    use HasFactory;
    protected $table = 'specialist_slots';
    protected $fillable = ['specialistId', 'startTime', 'endTime', 'isBooked'];
    protected function casts(): array
    {
        return ['startTime' => 'datetime', 'endTime' => 'datetime', 'isBooked' => 'boolean'];
    }
    public function specialist()
    {
        return $this->belongsTo(Specialist::class, 'specialistId');
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'slotId');
    }
}
