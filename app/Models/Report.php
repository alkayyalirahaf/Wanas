<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Report extends Model
{
    protected $table = 'reports';
    protected $guarded = ['id'];
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporterId');
    }
    // targetType/targetId are polymorphic in shape but intentionally have no DB foreign key.
    public function target()
    {
        return $this->morphTo(__FUNCTION__, 'targetType', 'targetId');
    }
}
