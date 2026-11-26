<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Group extends Model
{
    use SoftDeletes;
    protected $table = 'groups';
    protected $fillable = ['ownerId', 'title', 'topic', 'description', 'coverImageUrl', 'isPrivate', 'status'];
    protected function casts(): array
    {
        return ['isPrivate' => 'boolean'];
    }
    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId');
    }
    public function memberships()
    {
        return $this->hasMany(Membership::class, 'groupId');
    }
    public function members()
    {
        return $this->belongsToMany(User::class, 'memberships', 'groupId', 'userId')->withPivot(['id', 'status', 'requestMessage', 'joinedAt']);
    }
    public function events()
    {
        return $this->hasMany(Event::class, 'groupId');
    }
}
