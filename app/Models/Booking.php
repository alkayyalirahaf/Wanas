<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Booking extends Model
{
    protected $table = 'bookings';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['startsAt' => 'datetime', 'endsAt' => 'datetime', 'amount' => 'decimal:2', 'platformCommission' => 'decimal:2', 'providerAmount' => 'decimal:2'];
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
    public function specialist()
    {
        return $this->belongsTo(Specialist::class, 'specialistId');
    }
    public function slot()
    {
        return $this->belongsTo(SpecialistSlot::class, 'slotId');
    }
    public function payments()
    {
        return $this->hasMany(Payment::class, 'bookingId');
    }
    public function review()
    {
        return $this->hasOne(Review::class, 'bookingId');
    }
}
