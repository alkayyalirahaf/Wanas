<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AiSession extends Model
{
    protected $table = 'ai_sessions';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['userInput' => 'array', 'recommendations' => 'array'];
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
