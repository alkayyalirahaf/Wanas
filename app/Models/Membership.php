<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Membership extends Model
{
    protected $table = 'memberships';
    protected $fillable = ['userId', 'groupId', 'status', 'requestMessage', 'joinedAt'];
    protected function casts(): array
    {
        return ['joinedAt' => 'datetime'];
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
    public function group()
    {
        return $this->belongsTo(Group::class, 'groupId');
    }
}
