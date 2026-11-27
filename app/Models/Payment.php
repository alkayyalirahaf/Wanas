<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Payment extends Model
{
    use HasFactory;
    protected $table = 'payments';
     protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'platformFee' => 'decimal:2'];
    }
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'bookingId');
    }
}
