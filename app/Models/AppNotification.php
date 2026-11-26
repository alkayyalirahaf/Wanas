<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AppNotification extends Model
{
    protected $table = 'notifications';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['isRead' => 'boolean'];
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
