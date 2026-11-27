<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class FacilitatorApplication extends Model
{
    use HasFactory;
    protected $table = 'facilitator_applications';
    protected $guarded = ['id'];
   
    public function applicant()
    {
        return $this->belongsTo(User::class, 'userId');
    }
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewedBy');
    }
}
