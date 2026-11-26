<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Specialist extends Model
{
    protected $table = 'specialists';
    protected $fillable = ['userId', 'specialty', 'bio', 'price', 'status'];
    protected function casts(): array
    {
        return ['price' => 'decimal:2'];
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
    public function slots()
    {
        return $this->hasMany(SpecialistSlot::class, 'specialistId');
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'specialistId');
    }
}
