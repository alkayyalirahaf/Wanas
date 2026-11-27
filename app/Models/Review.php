<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Review extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $table = 'reviews';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['rating' => 'integer'];
    }
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'bookingId');
    }
}
